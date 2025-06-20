const initialState = {
    sidebarShow: true,
  };
  
  export const coreUIReducer = (state = initialState, action) => {
    switch (action.type) {
      case "set":
        return { ...state, ...action.payload };
      default:
        return state;
    }
  };
  