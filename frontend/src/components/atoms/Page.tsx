import * as React from "react";
import styled from "styled-components";

const Backdrop = styled.div`
  position: absolute;
  top: 50px;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #293742;
  z-index: 100;
`;

const Container = styled.div`
  max-width: 800px;
  margin: auto;
  padding: 2em;
`;

const Page: React.FC = ({ children }) => (
  <Backdrop>
    <Container>{children}</Container>
  </Backdrop>
);

export default Page;
