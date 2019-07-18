import { Classes, Code, H1, H2, H4 } from "@blueprintjs/core";
import * as React from "react";
import { Page } from "../Page";

export const AboutScreen: React.FC = () => (
  <Page>
    <H1>About</H1>
    <p className={Classes.RUNNING_TEXT}>
      fediverse.space is a tool to visualize networks and communities on the{" "}
      <a href="https://en.wikipedia.org/wiki/Fediverse" target="_blank" rel="noopener noreferrer">
        fediverse
      </a>
      . It works by crawling every instance it can find and aggregating statistics on communication between these.
    </p>

    <H2>FAQ</H2>

    <H4>Why can't I see details about my instance?</H4>
    <p className={Classes.RUNNING_TEXT}>
      Currently, fediverse.space only supports Mastodon and Pleroma instances. In addition, instances with 10 or fewer
      users won't be scraped -- it's a tool for understanding communities, not individuals.
    </p>

    <H4>
      When is <Code>$OTHER_ACTIVITYPUB_SERVER</Code> going to be added?
    </H4>
    <p className={Classes.RUNNING_TEXT}>
      Check out{" "}
      <a href="https://gitlab.com/taobojlen/fediverse.space/issues/24" target="_blank" rel="noopener noreferrer">
        this GitLab issue
      </a>
      .
    </p>

    <H4>How do I add my personal instance?</H4>
    <p className={Classes.RUNNING_TEXT}>
      Send a DM to{" "}
      <a href="https://cursed.technology/@fediversespace" target="_blank" rel="noopener noreferrer">
        @fediversespace
      </a>{" "}
      on Mastodon. Make sure to send it from the account that's listed as the instance admin.
    </p>

    <H4>How do you calculate the strength of relationships between instances?</H4>
    <p className={Classes.RUNNING_TEXT}>
      fediverse.space scrapes the last 5000 statuses from within the last month on the public timeline of each instance.
      It looks at the ratio of
      <Code>mentions of an instance / total statuses</Code>. It uses a ratio rather than an absolute number of mentions
      to reflect that smaller instances can play a large role in a community.
    </p>

    <H2>Credits</H2>
    <p className={Classes.RUNNING_TEXT}>
      This site is inspired by several other sites in the same vein:
      <ul className={Classes.LIST}>
        <li>
          <a href="https://the-federation.info/" target="_blank" rel="noopener noreferrer">
            the-federation.info
          </a>
        </li>
        <li>
          <a href="http://fediverse.network/" target="_blank" rel="noopener noreferrer">
            fediverse.network
          </a>
        </li>
        <li>
          <a
            href="https://lucahammer.at/vis/fediverse/2018-08-30-mastoverse_hashtags/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mastodon hashtag network
          </a>
          {" by "}
          <a href="https://vis.social/web/statuses/100634284168959187" target="_blank" rel="noopener noreferrer">
            @Luca@vis.social
          </a>
        </li>
      </ul>
      The source code for fediverse.space is available on{" "}
      <a href="https://gitlab.com/taobojlen/fediverse.space" target="_blank" rel="noopener noreferrer">
        GitLab
      </a>
      ; issues and pull requests are welcome!
    </p>
  </Page>
);
