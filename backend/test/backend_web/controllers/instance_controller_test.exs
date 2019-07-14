defmodule BackendWeb.InstanceControllerTest do
  use BackendWeb.ConnCase

  alias Backend.Api
  alias Backend.Api.Instance

  @create_attrs %{
    name: "some name"
  }
  @update_attrs %{
    name: "some updated name"
  }
  @invalid_attrs %{name: nil}

  def fixture(:instance) do
    {:ok, instance} = Api.create_instance(@create_attrs)
    instance
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all instances", %{conn: conn} do
      conn = get(conn, Routes.instance_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create instance" do
    test "renders instance when data is valid", %{conn: conn} do
      conn = post(conn, Routes.instance_path(conn, :create), instance: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, Routes.instance_path(conn, :show, id))

      assert %{
               "id" => id,
               "name" => "some name"
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.instance_path(conn, :create), instance: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update instance" do
    setup [:create_instance]

    test "renders instance when data is valid", %{conn: conn, instance: %Instance{id: id} = instance} do
      conn = put(conn, Routes.instance_path(conn, :update, instance), instance: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.instance_path(conn, :show, id))

      assert %{
               "id" => id,
               "name" => "some updated name"
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn, instance: instance} do
      conn = put(conn, Routes.instance_path(conn, :update, instance), instance: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete instance" do
    setup [:create_instance]

    test "deletes chosen instance", %{conn: conn, instance: instance} do
      conn = delete(conn, Routes.instance_path(conn, :delete, instance))
      assert response(conn, 204)

      assert_error_sent 404, fn ->
        get(conn, Routes.instance_path(conn, :show, instance))
      end
    end
  end

  defp create_instance(_) do
    instance = fixture(:instance)
    {:ok, instance: instance}
  end
end
