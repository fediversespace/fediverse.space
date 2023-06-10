defmodule Backend.HttpBehaviour do
  @moduledoc """
  This module defines the behavior for HTTP requests.
  """

  defmodule Error do
    defstruct message: nil, status_code: nil, body: nil
    @type t :: %__MODULE__{message: String.t(), status_code: integer | nil, body: term | nil}
  end

  @type response :: {:ok, Response.t()} | {:error, __MODULE__.Error.t() | Jason.DecodeError.t()}

  @callback get_and_decode(String.t()) :: response
  @callback get_and_decode(String.t(), Atom.t(), Integer.t(), any()) :: response

  @callback get_and_decode!(String.t()) :: Response.t()
  @callback get_and_decode!(String.t(), Atom.t(), Integer.t(), any()) :: Response.t()

  @callback post_and_decode(String.t()) :: response()
  @callback post_and_decode(String.t(), String.t()) :: response()
  @callback post_and_decode!(String.t()) :: Response.t()
  @callback post_and_decode!(String.t(), String.t()) :: Response.t()
end
