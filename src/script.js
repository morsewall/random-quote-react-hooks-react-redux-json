"use strict";

//Redux:

// The UMD build makes Redux available as a window.Redux global variable
const Redux = window.Redux;

// defining action types for the special asynch action creator-type function
const REQUESTING_API_DATA = "REQUESTING_API_DATA";
const RECEIVED_API_DATA = "RECEIVED_API_DATA";

// defining action creators related to the asynch function. Action creator is  a function that returns an action (object that contains information about an action-event that has occurred). The action creator gets called by `dispatch()`
const requestingApiData = () => {
  return {
    type: REQUESTING_API_DATA
  };
};

const receivedApiData = apiData => {
  return {
    type: RECEIVED_API_DATA,
    payloadQuotes: apiData
  };
};

// defining a special action creator that returns a function. The returned function takes dispatch as an argument. Within this function, I can dispatch actions and perform asynchronous requests. It's common to dispatch an action before initiating any asynchronous behavior so that the application state knows that some data is being requested (this state could display a loading icon, for instance). Then, once the application receives the data, another action is dispatched, an action that carries the data as a payload along with information that the action is completed.
const handleAsync = () => {
  return function(dispatch) {
    // dispatch request action here
    store.dispatch(requestingApiData());
    const makeRequest = async () => {
      const responseJSON = await fetch(
        "https://cdn.jsdelivr.net/gh/morsewall/jsondb@master/db.json"
      );
      const responseObject = await responseJSON.json();
      const quotesArray = responseObject.quotes;
      // dispatch received data action here
      store.dispatch(receivedApiData(quotesArray));
      let initialQuote =
        quotesArray[Math.floor(Math.random() * quotesArray.length)];
      store.dispatch(newQuoteActionCreator(initialQuote));
    };
    makeRequest();
  };
};

// defining initial state
const initialState = {
  status: "",
  quotesData: []
};

//defining an action type
const NEW_QUOTE = "NEW_QUOTE";

//defining an action creator, which creates the action to select a new quote.  The action creator is a function that returns an action (object that contains information about an action-event that has occurred). It creates the action to add a new quote.
const newQuoteActionCreator = chosenQuoteInput => {
  return {
    type: NEW_QUOTE,
    payloadQuote: chosenQuoteInput
  };
};

//defining reducer functions to allow the Redux store to know how to respond to the action created
const getNextQuoteReducer = (state = initialState, action) => {
  switch (action.type) {
    case REQUESTING_API_DATA:
      return {
        ...state,
        status: "waiting",
        quotesData: []
      };
    case RECEIVED_API_DATA:
      return {
        ...state,
        status: "received",
        quotesData: action.payloadQuotes
      };
    case NEW_QUOTE:
      return {
        ...state,
        status: "new quote",
        data: action.payloadQuote
      };
    default:
      return state;
  }
};

// The UMD build makes Redux-Thunk available as a window.ReduxThunk.default global variable
const ReduxThunk = window.ReduxThunk.default;

//to add Chrome's Redux DevTool's extension https://github.com/zalmoxisus/redux-devtools-extension that allows me to go back in the state history. When the extension is not installed, I'm using Redux’s compose.
const composeEnhancers =
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || Redux.compose;

//creating the Redux store, including Redux Thunk middleware. This is where the state lives.
const store = Redux.createStore(
  getNextQuoteReducer,
  /* preloadedState, */ composeEnhancers(Redux.applyMiddleware(ReduxThunk))
);

// React:

//creating a reusable quote box to handle a potential "future case" in which I want to add more screens/routes to the app and use the same quote box, but with different text(data).
//I'm getting author and text values from App component via props.
const QuoteBox = ({ text, author }) => {
  //destructuring
  return (
    <React.Fragment>
      <div className="quotable-square">
        <div className="content">
          <div id="text">{text}</div>
          <div id="author" className="author">
            {author}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

//creating a reusable button to handle a potential "future case" in which I want to have two buttons, instead of having one New Quote button. For instance: one for Next Quote and one for Previous Quote.
const Button = ({ onClick, title }) => {
  return (
    <button className="new-quote" onClick={onClick}>
      {title}
    </button>
  );
};

//creating a reusable share button to handle a potential "future case" in which I want to add additional social share buttons. These buttons would then share the same styling but different props.
const TwitterShare = ({ link }) => {
  return (
    <React.Fragment>
      <button className="tweet-quote">
        <a
          href={link}
          target="_blank"
          title="Tweet this on Twitter"
          id="tweet-quote"
        >
          <i className="fab fa-twitter"></i>Tweet Quote
        </a>
      </button>
    </React.Fragment>
  );
};

//defining a component for the loading spinner
const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loader-dzg" />
    </div>
  );
};

// defining the function component. Redux state and dispatch are passed to the component as props
const App = props => {
  React.useEffect(() => {
    props.handleAsyncFX();
  }, []);

  //making the machine tweet
  let twitterLink;

  if (props.currentQuote) {
    let quoteTextElem = props.currentQuote.quoteText;
    let quoteAuthorElem = " - " + props.currentQuote.quoteAuthor;
    let contentQuote = quoteTextElem + quoteAuthorElem;
    if (contentQuote.length > 280) {
      let charCountAuthor = quoteAuthorElem.length;
      const extraStylingChar = "..." + '"';
      let extraCharCount = extraStylingChar.length;
      let subString =
        quoteTextElem.substring(0, 280 - extraCharCount - charCountAuthor) +
        extraStylingChar +
        quoteAuthorElem;
      //generate url available for Twitter intent and inject url on HTML
      twitterLink = "https://twitter.com/intent/tweet?text=" + subString;
    } else {
      //generate url available for Twitter intent and inject url on HTML
      twitterLink = "https://twitter.com/intent/tweet?text=" + contentQuote;
    }
  }

  const random = array => {
    return Math.floor(Math.random() * array.length);
  };

  const randomQuoteFunction = array => {
    return array[random(array)];
  };

  //defining a function to (ultimately) update the Redux state with a new quote. Passing a randomly selected quote via props. Dispatching selectNewQuote() from props and passing in the randomly selected new quote as an argument
  const chosenRandomQuoteToState = () => {
    //selecting a random quote from the array
    let chosenQuote = randomQuoteFunction(props.stateQuotes);
    props.selectNewQuote(chosenQuote);
  };

  //the component returns JSX, and as per code snippet below, JSX clearly represents HTML, composing the UI.
  //as a React component can only return one single element, I’m using <React.Fragment> to add a parent tag to my JSX elements without adding an extra node to the DOM.
  return (
    <React.Fragment>
      {(() => {
        switch (props.stateStatus) {
          case "waiting":
            return <Loading />;
          case "received":
            return <Loading />;
          case "new quote":
            return (
              <React.Fragment>
                <div className="container">
                  <div id="quote-box">
                    {/* //passing data via props to QuoteBox component */}
                    <QuoteBox
                      text={props.currentQuote.quoteText}
                      author={props.currentQuote.quoteAuthor}
                    />
                    <div className="actions">
                      <Button
                        id="new-quote"
                        title="Get New Quote"
                        onClick={chosenRandomQuoteToState}
                      />
                      <TwitterShare link={twitterLink} />
                    </div>
                  </div>
                </div>
                <footer>
                  <ul className="footer-options">
                    <li className="footer-link">
                      <a href="#" className="footer-linktext">
                        Legal
                      </a>
                    </li>
                    <li className="footer-link">
                      <a href="#" className="footer-linktext">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                  <span>
                    © 2019 Developed by Pat Eskinasy. All Rights Reserved.
                  </span>
                </footer>
              </React.Fragment>
            );
        }
      })()}
    </React.Fragment>
  );
};

// React Redux:

//using Provider to connect redux to react. Allows me to provide state and dispatch to React components. Setting React Redux Provider to a constant.
const Provider = ReactRedux.Provider;

//mapping state to props. Allows me to specify exactly what pieces of the state should the React component have access to. Taking state as argument, it returns an object which maps that state to specific property names. These properties will become accessible to the React component via props
const mapStateToProps = state => {
  return {
    currentQuote: state.data,
    stateQuotes: state.quotesData,
    stateStatus: state.status
  };
};

//mapping dispatch to props. Specifying what actions should the React component have access to. Allows me to specify which action creators I need to be able to dispatch. It is used to provide specific action creators to the React components so they can dispatch actions against the Redux store. It returns an object that maps dispatch actions to property names, which become component props. As opposed to mapStateToProps (that returns a piece of state), here each property returns a function that calls dispatch with an action creator and any relevant action data. I have access to this dispatch because it's passed in to mapDispatchToProps() as a parameter when I define the function, just like I've passed state to mapStateToProps(). The object should have a property selectNewQuote set to the dispatch function, which takes a parameter for the new quote to add when it dispatches newQuoteActionCreator(). It should also have a property handleAsyncFX set to a dispatch function that dispatches handleAsync().
const mapDispatchToProps = dispatch => {
  return {
    selectNewQuote: function(quoteToBeNewQuote) {
      dispatch(newQuoteActionCreator(quoteToBeNewQuote));
    },
    handleAsyncFX: function() {
      dispatch(handleAsync());
    }
  };
};

//setting React Redux connect to a constant.
const connect = ReactRedux.connect;

//connecting Redux to React. Mapping state and dispatch to the props of the React component. Container then represents the connected component.
const Container = connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

//defining the Provider wrapper. Allows me to access the Redux store and dispatch functions. Finalizing connecting the Redux store with the React component, thereby extracting the local state into the Redux store. Provider wraps the React app and allows me to access the Redux store and dispatch actions throughout the React component. The Redux store is passed as a prop to the Provider.
const AppWrapper = () => {
  return (
    <Provider store={store}>
      <Container />
    </Provider>
  );
};

// React:

//placing JSX into React’s own DOM
ReactDOM.render(<AppWrapper />, document.getElementById("app"));
