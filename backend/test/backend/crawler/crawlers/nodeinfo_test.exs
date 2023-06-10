defmodule Backend.Crawler.Crawlers.NodeinfoTest do
  use ExUnit.Case

  alias Backend.Crawler.Crawlers.Nodeinfo
  import Mox

  setup :verify_on_exit!

  describe "crawl/2" do
    test "handles valid nodeinfo" do
      expect(HttpMock, :get_and_decode, fn "https://mastodon.social/.well-known/nodeinfo" ->
        {:ok,
         %{
           "links" => [
             %{
               "rel" => "http://nodeinfo.diaspora.software/ns/schema/2.0",
               "href" => "https://mastodon.social/nodeinfo/2.0"
             }
           ]
         }}
      end)

      expect(HttpMock, :get_and_decode, fn "https://mastodon.social/nodeinfo/2.0" ->
        {:ok,
         %{
           "version" => "2.0",
           "software" => %{
             "name" => "Mastodon",
             "version" => "1.2.3"
           },
           "protocols" => ["activitypub"],
           "services" => %{
             "inbound" => [],
             "outbound" => []
           },
           "usage" => %{
             "users" => %{
               "total" => 100,
               "activeMonth" => 1,
               "activeHalfYear" => 2
             },
             "localPosts" => 3
           },
           "openRegistrations" => true,
           "metadata" => %{}
         }}
      end)

      result = Nodeinfo.crawl("mastodon.social", %{})

      assert result == %{
               description: nil,
               user_count: 100,
               status_count: 3,
               statuses_seen: 0,
               instance_type: :mastodon,
               version: "1.2.3",
               federation_restrictions: [],
               interactions: %{},
               peers: []
             }
    end

    test "handles small instances" do
      expect(HttpMock, :get_and_decode, fn "https://mastodon.social/.well-known/nodeinfo" ->
        {:ok,
         %{
           "links" => [
             %{
               "rel" => "http://nodeinfo.diaspora.software/ns/schema/2.0",
               "href" => "https://mastodon.social/nodeinfo/2.0"
             }
           ]
         }}
      end)

      expect(HttpMock, :get_and_decode, fn "https://mastodon.social/nodeinfo/2.0" ->
        {:ok,
         %{
           "version" => "2.0",
           "software" => %{
             "name" => "Mastodon",
             "version" => "1.2.3"
           },
           "protocols" => ["activitypub"],
           "services" => %{
             "inbound" => [],
             "outbound" => []
           },
           "usage" => %{
             "users" => %{
               "total" => 1,
               "activeMonth" => 1,
               "activeHalfYear" => 1
             },
             "localPosts" => 3
           },
           "openRegistrations" => true,
           "metadata" => %{}
         }}
      end)

      result = Nodeinfo.crawl("mastodon.social", %{})

      assert result == %{
               description: nil,
               user_count: 1,
               status_count: nil,
               statuses_seen: 0,
               instance_type: nil,
               version: nil,
               federation_restrictions: [],
               interactions: %{},
               peers: []
             }
    end

    test "handles missing nodeinfo" do
      expect(HttpMock, :get_and_decode, fn "https://mastodon.social/.well-known/nodeinfo" ->
        {:ok, %{}}
      end)

      result = Nodeinfo.crawl("mastodon.social", %{})

      assert result == %{
               description: nil,
               user_count: nil,
               status_count: nil,
               statuses_seen: 0,
               instance_type: nil,
               version: nil,
               federation_restrictions: [],
               interactions: %{},
               peers: []
             }
    end

    test "handles non-200 response" do
      expect(HttpMock, :get_and_decode, fn "https://mastodon.social/.well-known/nodeinfo" ->
        {:error, %Backend.HttpBehaviour.Error{status_code: 401}}
      end)

      result = Nodeinfo.crawl("mastodon.social", %{})

      assert result == %{
               description: nil,
               user_count: nil,
               status_count: nil,
               statuses_seen: 0,
               instance_type: nil,
               version: nil,
               federation_restrictions: [],
               interactions: %{},
               peers: []
             }
    end
  end
end
