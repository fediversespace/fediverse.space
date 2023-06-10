defmodule Backend.Crawler.Crawlers.MisskeyTest do
  use Backend.DataCase

  alias Backend.Crawler.Crawlers.Misskey
  alias Backend.Crawler.ApiCrawler
  import Mox

  setup :verify_on_exit!

  describe "is_instance_type?/2" do
    test "returns true for misskey instance" do
      expect(HttpMock, :post_and_decode, fn "https://example.com/api/meta" ->
        {:ok, TestHelpers.load_json("misskey/meta.json")}
      end)

      assert Misskey.is_instance_type?("example.com", nil)
    end
  end

  describe "crawl/2" do
    test "does nothing for small instances" do
      expect(HttpMock, :post_and_decode, fn "https://example.com/api/stats" ->
        stats =
          TestHelpers.load_json("misskey/stats.json") |> Map.merge(%{"originalUsersCount" => 1})

        {:ok, stats}
      end)

      result = Misskey.crawl("example.com", ApiCrawler.get_default())

      assert result == ApiCrawler.get_default() |> Map.merge(%{type: :misskey, user_count: 1})
    end

    test "crawls large instances" do
      expect(HttpMock, :post_and_decode, fn "https://example.com/api/stats" ->
        {:ok, TestHelpers.load_json("misskey/stats.json")}
      end)

      expect(HttpMock, :post_and_decode, fn "https://example.com/api/meta" ->
        {:ok, TestHelpers.load_json("misskey/meta.json")}
      end)

      expect(HttpMock, :get_and_decode, fn "https://example.com/api/v1/instance/peers" ->
        {:ok, TestHelpers.load_json("misskey/peers.json")}
      end)

      # status_count_limit is 5, response has 1 post per page, so we expect 5 requests
      expect(HttpMock, :post_and_decode!, 5, fn "https://example.com/api/notes/local-timeline",
                                                %{limit: 100} ->
        TestHelpers.load_json("misskey/notes.json")
      end)

      result = Misskey.crawl("example.com", ApiCrawler.get_default())

      assert result == %{
               description: "some description",
               federation_restrictions: [],
               instance_type: :misskey,
               interactions: %{},
               peers: ["other.com"],
               status_count: 20,
               statuses_seen: 5,
               user_count: 20,
               version: "13.12.2"
             }
    end
  end
end
