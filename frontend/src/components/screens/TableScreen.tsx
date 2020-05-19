import { H1 } from "@blueprintjs/core";
import React from "react";
import { Page } from "../atoms";
import { InstanceTable } from "../organisms";

class TableScreen extends React.PureComponent {
  public render() {
    return (
      <Page fullWidth>
        <H1>Instances</H1>
        <InstanceTable />
      </Page>
    );
  }
}

export default TableScreen;
