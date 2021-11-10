import * as React from "react";
import Loader from "src/components/Loader/Loader";
import "./Status.css";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import AppBtc from "@ledgerhq/hw-app-btc";
import { LedgerContext } from 'src/ledger-context';

interface IState {
  apiStatus: boolean;
  ledgerStatus: boolean;
  isLoading: boolean;
}

class Status extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);

    this.initLedger = this.initLedger.bind(this);

    this.state = {
      apiStatus: false,
      ledgerStatus: false,
      isLoading: false
    };
  }

  public async initLedger(e: any) {
    try {
      e.preventDefault();

      let context = this.context
      console.log("initing ledger", context)
      const transport = await TransportWebUSB.create()
      console.log(transport)

      const appPPC = new AppBtc(transport)

      // Gets PPC wallet info
      const result = await appPPC.getWalletPublicKey("44'/6'/0'/0/0");


      console.log(appPPC)

      if (result.bitcoinAddress !== undefined) {
        this.setState({
          ledgerStatus: true
        })

        this.context.connected = true
        this.context.address = result.bitcoinAddress
        console.log(context)
      }
    } catch (error) { alert("Make sure your Ledger is connected and the Peercoin app is selected and try again.\n" + error) }
  }

  public componentDidMount() {
    // simplest solution : used getaddress API with old address
    fetch("https://blockbook.peercoin.net/api")
      .then()
      .then(
        result => {
          this.setState({
            apiStatus: true
          });
        },
        error => {
          this.setState({
            apiStatus: false
          });
        }
      );
  }

  public render() {
    return (
      <div className="StatusComp">
        {this.state.isLoading && <Loader />}
        {this.state.apiStatus && (
          <div className="status-btn">
            <img src="img/status_on.svg" alt="connected" />
          </div>
        )}
        {!this.state.apiStatus && (
          <div className="status-btn">
            <img src="img/status_off.svg" alt="disconnected" />
          </div>
        )}

        {this.state.ledgerStatus && (
          <div className="status-btn status-btn-ledger">
            <img src="img/ledger-connected.png" alt="connected" />
          </div>
        )}
        {!this.state.ledgerStatus && (
          <div className="status-btn status-btn-ledger" onClick={this.initLedger} >
            <img src="img/ledger.png" alt="disconnected" />
          </div>
        )}
      </div>
    );
  }
}

Status.contextType = LedgerContext;

export default Status;
