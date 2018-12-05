//Declares new React element
const e = React.createElement;
var endTimer = false;

//One time free advice component gives random advice
class Advice extends React.Component {
  constructor(props) {
    super(props);
    this.state = { clicked: false, close: false};
  }

  render() {
    if (this.state.clicked) {
      this.setState = ({close: true})
      let array = ["Protect the king!", "Trade when you're ahead", "Always castle", "Establish board control"];
      let rand = Math.floor(Math.random()*array.length);
      return e(
        'div',
        {class: "Advice"},
        array[rand]
        )
        

    }
      return e(
        'button',
        { onClick: () => this.setState({ clicked: true }) },
        'One-time advice'
      )

  }
}

//Timer component counts down from 30 minutes for the free trial
class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {minutes: 30, seconds: 0};
  }
  tick() {
    this.setState(state => ({
      
        minutes: state.seconds > 0 ? state.minutes: state.minutes - 1,
        seconds: state.seconds > 0 ? state.seconds - 1: state.seconds = 59
    }))


    
    if (this.state.minutes == 0 && this.state.seconds == 0) {
      clearInterval(this.interval)
      this.setState({stop: true})
      endTimer = true;

      
    }
  }

  

  componentDidMount() {
      
        this.interval = setInterval(() => this.tick(), 1000);
      
  }


  componentWillUnmount() {
    clearInterval(this.interval);
  }


  render() {
    return e(
      'div',
      {id: "timer"},
      `Free trial ends in: ${this.state.minutes}:`,
      `${this.state.seconds}`
      
     
    );
  }
}


class Page extends React.Component {
  render() {
    return[
      e(Advice)
      ,e(Timer)
      
  ]
  }
}

function loadPage() {
  ReactDOM.render(e(Page), document.getElementById("root"));
}
loadPage();

