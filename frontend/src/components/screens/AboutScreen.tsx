import { Classes, Code, H1, H2, H3 } from "@blueprintjs/core";
import * as React from "react";
import styled from "styled-components";
import appsignalLogo from "../../assets/appsignal.png";
import gitlabLogo from "../../assets/gitlab.png";
import nlnetLogo from "../../assets/nlnet.png";
import { Page } from "../atoms";

const SponsorContainer = styled.div`
  margin-bottom: 20px;
`;
const Sponsor = styled.div`
  margin: 10px 40px 10px 0;
  display: inline-block;
`;

const AboutScreen: React.FC = () => (
  <Page>
    <H1>About</H1>
    <p className={Classes.RUNNING_TEXT}>
      fediverse.space is a tool to visualize networks and communities on the{" "}
      <a href="https://en.wikipedia.org/wiki/Fediverse" target="_blank" rel="noopener noreferrer">
        fediverse
      </a>
      . It works by crawling every instance it can find and aggregating statistics on communication between these.
    </p>

    <p>
      You can follow the project on{" "}
      <a href="https://mastodon.social/@fediversespace" target="_blank" rel="noopener noreferrer">
        Mastodon
      </a>
      , and read more about what I&apos;m up to on my{" "}
      <a href="https://www.btao.org" target="_blank" rel="noopener noreferrer">
        website
      </a>
      .
    </p>

    <br />
    <H2>FAQ</H2>

    <H3>Why can&apos;t I see details about my instance?</H3>
    <p className={Classes.RUNNING_TEXT}>
      fediverse.space only supports servers using the Mastodon API, the Misskey API, the GNU Social API, or Nodeinfo.
      Instances with 10 or fewer users won&apos;t be crawled -- it&apos;s a tool for understanding communities, not
      individuals.
    </p>

    <H3>
      When is <Code>$OTHER_FEDIVERSE_SERVER</Code> going to be added?
    </H3>
    <p className={Classes.RUNNING_TEXT}>
      Check out{" "}
      <a href="https://gitlab.com/taobojlen/fediverse.space/issues/24" target="_blank" rel="noopener noreferrer">
        this GitLab issue
      </a>
      .
    </p>

    <H3>How do I add my personal instance?</H3>
    <p className={Classes.RUNNING_TEXT}>Click on the Administration link in the top right to opt-in.</p>

    <H3>How do you calculate the strength of relationships between instances?</H3>
    <p className={Classes.RUNNING_TEXT}>
      fediverse.space looks at public statuses from within the last month on the public timeline of each instance. It
      calculates at the ratio of
      <Code>mentions of an instance / total statuses</Code>. It uses a ratio rather than an absolute number of mentions
      to reflect that smaller instances can play a large role in a community.
    </p>

    <br />
    <H2>Special thanks</H2>

    <SponsorContainer>
      <Sponsor>
        <a href="https://nlnet.nl/project/fediverse_space/" target="_blank" rel="noopener noreferrer">
          <img src={nlnetLogo} alt="NLnet logo" height={80} />
        </a>
      </Sponsor>
      <br />
      <Sponsor>
        <a href="https://appsignal.com" target="_blank" rel="noopener noreferrer">
          <img src={appsignalLogo} alt="Appsignal logo" height={50} />
        </a>
      </Sponsor>
      <Sponsor>
        <a href="https://gitlab.com" target="_blank" rel="noopener noreferrer">
          <img src={gitlabLogo} alt="GitLab logo" height={40} />
        </a>
      </Sponsor>
    </SponsorContainer>

    <p className={Classes.RUNNING_TEXT}>Inspiration for this site comes from several places:</p>
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
    <p>
      The source code for fediverse.space is available on{" "}
      <a href="https://gitlab.com/taobojlen/fediverse.space" target="_blank" rel="noopener noreferrer">
        GitLab
      </a>
      ; issues and pull requests are welcome!
    </p>
  </Page>
);
export default AboutScreen;
