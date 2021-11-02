import * as React from "react";
import Loader from "src/components/Loader/Loader";
import "./Status.css";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";

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

  public initLedger(e: any) {
    try {
      e.preventDefault();
      console.log("initing ledger")
      TransportWebUSB.create().then(transport => {
        console.log(transport)
        this.setState({
          ledgerStatus: true
        });
      })
    } catch (error) { console.log(error) }
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
            <img id="ledgerImage" src="img/ledger-connected.png" alt="disconnected" />
          </div>
        )}
        {!this.state.ledgerStatus && (
          <div className="status-btn status-btn-ledger" onClick={this.initLedger} >
            <img id="ledgerImage" src="img/ledger.png" alt="disconnected" />
          </div>
        )}
      </div>
    );
  }
}

export default Status;
