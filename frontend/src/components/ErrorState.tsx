import { NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import * as React from 'react';


const ErrorState: React.SFC = () => (
    <NonIdealState
        icon={IconNames.ERROR}
        title={"Something went wrong."}
    />
)
export default ErrorState;