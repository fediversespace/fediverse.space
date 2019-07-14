defmodule Mix.Tasks.Crawl do
  alias Backend.Crawler
  use Mix.Task

  @shortdoc "Crawl a given instance."

  def run(domain) do
    Mix.Task.run("app.start")
    # Application.ensure_all_started(:timex)
    # Mix.Task.run("loadconfig")
    Crawler.run(domain)
  end
end
