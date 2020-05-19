import { Classes, H3 } from "@blueprintjs/core";
import React from "react";
import { Link } from "react-router-dom";
import { FederationRestrictions } from "../../redux/types";

const maybeGetList = (domains?: string[]) =>
  domains && (
    <ul>
      {domains.sort().map((domain) => (
        <li key={domain}>
          <Link to={`/instance/${domain}`} className={`${Classes.BUTTON} ${Classes.MINIMAL}`} role="button">
            {domain}
          </Link>
        </li>
      ))}
    </ul>
  );

interface FederationTabProps {
  restrictions?: FederationRestrictions;
}
const FederationTab: React.FC<FederationTabProps> = ({ restrictions }) => {
  if (!restrictions) {
    return null;
  }

  const reportsRemovalList = maybeGetList(restrictions.reportRemoval);
  const rejectsList = maybeGetList(restrictions.reject);
  const mediaRemovalsList = maybeGetList(restrictions.mediaRemoval);
  const mediaNsfwsList = maybeGetList(restrictions.mediaNsfw);
  const federatedTimelineRemovalsList = maybeGetList(restrictions.federatedTimelineRemoval);
  const bannerRemovalsList = maybeGetList(restrictions.bannerRemoval);
  const avatarRemovalsList = maybeGetList(restrictions.avatarRemoval);
  const acceptedList = maybeGetList(restrictions.accept);

  return (
    <>
      {rejectsList && (
        <>
          <H3>Blocked instances</H3>
          {rejectsList}
        </>
      )}
      {reportsRemovalList && (
        <>
          <H3>Reports ignored</H3>
          {reportsRemovalList}
        </>
      )}
      {mediaRemovalsList && (
        <>
          <H3>Media removed</H3>
          {mediaRemovalsList}
        </>
      )}
      {mediaNsfwsList && (
        <>
          <H3>Media marked as NSFW</H3>
          {mediaNsfwsList}
        </>
      )}
      {federatedTimelineRemovalsList && (
        <>
          <H3>Hidden from federated timeline</H3>
          {federatedTimelineRemovalsList}
        </>
      )}
      {bannerRemovalsList && (
        <>
          <H3>Banners removed</H3>
          {bannerRemovalsList}
        </>
      )}
      {avatarRemovalsList && (
        <>
          <H3>Avatars removed</H3>
          {avatarRemovalsList}
        </>
      )}
      {acceptedList && (
        <>
          <H3>Whitelisted</H3>
          {acceptedList}
        </>
      )}
    </>
  );
};
export default FederationTab;
