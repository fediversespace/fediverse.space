import * as React from "react";
import styled from "styled-components";

const Backdrop = styled.div`
  position: absolute;
  top: 50px;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #293742;
  z-index: 3;
`;

interface ContainerProps {
  fullWidth?: boolean;
}
const Container = styled.div<ContainerProps>`
  max-width: ${(props) => (props.fullWidth ? "100%" : "800px")};
  margin: auto;
  padding: 2em;
`;

interface PageProps {
  fullWidth?: boolean;
}
const Page: React.FC<PageProps> = ({ children, fullWidth }) => (
  <Backdrop>
    <Container fullWidth={fullWidth}>{children}</Container>
  </Backdrop>
);

export default Page;
