defmodule BackendWeb.GraphControllerTest do
  use BackendWeb.ConnCase

  alias Backend.Api
  alias Backend.Api.Graph

  @create_attrs %{
    id: "some id",
    label: "some label",
    size: 120.5,
    x: 120.5,
    y: 120.5
  }
  @update_attrs %{
    id: "some updated id",
    label: "some updated label",
    size: 456.7,
    x: 456.7,
    y: 456.7
  }
  @invalid_attrs %{id: nil, label: nil, size: nil, x: nil, y: nil}

  def fixture(:graph) do
    {:ok, graph} = Api.create_graph(@create_attrs)
    graph
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all nodes", %{conn: conn} do
      conn = get(conn, Routes.graph_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create graph" do
    test "renders graph when data is valid", %{conn: conn} do
      conn = post(conn, Routes.graph_path(conn, :create), graph: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, Routes.graph_path(conn, :show, id))

      assert %{
               "id" => id,
               "id" => "some id",
               "label" => "some label",
               "size" => 120.5,
               "x" => 120.5,
               "y" => 120.5
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.graph_path(conn, :create), graph: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update graph" do
    setup [:create_graph]

    test "renders graph when data is valid", %{conn: conn, graph: %Graph{id: id} = graph} do
      conn = put(conn, Routes.graph_path(conn, :update, graph), graph: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.graph_path(conn, :show, id))

      assert %{
               "id" => id,
               "id" => "some updated id",
               "label" => "some updated label",
               "size" => 456.7,
               "x" => 456.7,
               "y" => 456.7
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn, graph: graph} do
      conn = put(conn, Routes.graph_path(conn, :update, graph), graph: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete graph" do
    setup [:create_graph]

    test "deletes chosen graph", %{conn: conn, graph: graph} do
      conn = delete(conn, Routes.graph_path(conn, :delete, graph))
      assert response(conn, 204)

      assert_error_sent 404, fn ->
        get(conn, Routes.graph_path(conn, :show, graph))
      end
    end
  end

  defp create_graph(_) do
    graph = fixture(:graph)
    {:ok, graph: graph}
  end
end
