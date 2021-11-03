import * as React from "react";

export const ledgerStatus = {
    connected: false,
    address: '',
}

export const LedgerContext = React.createContext(
    ledgerStatus // default value
);