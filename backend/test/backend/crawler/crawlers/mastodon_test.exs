defmodule Backend.Crawler.Crawlers.MastodonTest do
  use Backend.DataCase

  alias Backend.Crawler.Crawlers.Mastodon
  alias Backend.Crawler.ApiCrawler
  alias Backend.HttpBehaviour
  import Mox

  setup :verify_on_exit!

  describe "is_instance_type?/2" do
    test "returns true for pleroma and smithereen" do
      assert Mastodon.is_instance_type?("example.com", %{instance_type: :pleroma})
      assert Mastodon.is_instance_type?("example.com", %{instance_type: :smithereen})
    end

    test "returns true for mastodon instance" do
      expect(HttpMock, :get_and_decode, fn "https://example.com/api/v1/instance" ->
        {:ok, TestHelpers.load_json("mastodon/instance.json")}
      end)

      assert Mastodon.is_instance_type?("example.com", nil)
    end
  end

  describe "crawl/2" do
    test "does nothing for small instances" do
      expect(HttpMock, :get_and_decode!, fn "https://example.com/api/v1/instance" ->
        TestHelpers.load_json("mastodon/instance.json")
        |> Map.merge(%{"stats" => %{"user_count" => 1}})
      end)

      result = Mastodon.crawl("example.com", ApiCrawler.get_default())

      assert result ==
               ApiCrawler.get_default() |> Map.merge(%{instance_type: :mastodon, user_count: 1})
    end

    test "crawls large instance" do
      expect(HttpMock, :get_and_decode!, fn "https://example.com/api/v1/instance" ->
        TestHelpers.load_json("mastodon/instance.json")
      end)

      expect(HttpMock, :get_and_decode, fn "https://example.com/api/v1/instance/peers" ->
        {:ok, TestHelpers.load_json("mastodon/peers.json")}
      end)

      expect(
        HttpMock,
        :get_and_decode,
        fn "https://example.com/api/v1/timelines/public?local=true&limit=40" ->
          {:ok, TestHelpers.load_json("mastodon/timeline.json")}
        end
      )

      expect(
        HttpMock,
        :get_and_decode,
        4,
        fn "https://example.com/api/v1/timelines/public?local=true&limit=40&max_id=123" ->
          {:ok, TestHelpers.load_json("mastodon/timeline.json")}
        end
      )

      result = Mastodon.crawl("example.com", ApiCrawler.get_default())

      assert result == %{
               description: "long description",
               federation_restrictions: [],
               instance_type: :mastodon,
               interactions: %{},
               peers: ["other.com"],
               user_count: 100,
               status_count: 100,
               statuses_seen: 5,
               version: "1.2.3"
             }
    end

    test "handles timelines that require auth" do
      expect(HttpMock, :get_and_decode!, fn "https://example.com/api/v1/instance" ->
        TestHelpers.load_json("mastodon/instance.json")
      end)

      expect(HttpMock, :get_and_decode, fn "https://example.com/api/v1/instance/peers" ->
        {:ok, TestHelpers.load_json("mastodon/peers.json")}
      end)

      expect(
        HttpMock,
        :get_and_decode,
        fn "https://example.com/api/v1/timelines/public?local=true&limit=40" ->
          {:error,
           %HttpBehaviour.Error{
             message: "HTTP request failed with status code 422",
             status_code: 422,
             body: "{\"error\":\"This method requires an authenticated user\"}"
           }}
        end
      )

      result = Mastodon.crawl("example.com", ApiCrawler.get_default())

      assert result == %{
               description: "long description",
               federation_restrictions: [],
               instance_type: :mastodon,
               interactions: %{},
               peers: ["other.com"],
               user_count: 100,
               status_count: 100,
               statuses_seen: 0,
               version: "1.2.3"
             }
    end
  end
end
