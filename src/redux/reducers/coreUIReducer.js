const initialState = {
    sidebarShow: true,
    dialerOpen: false,
    dialerNumber: '',
  };
  
  export const coreUIReducer = (state = initialState, action) => {
    switch (action.type) {
      case "set":
        return { ...state, ...action.payload };
      default:
        return state;
    }
  };
  