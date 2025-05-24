const AuthReducer = (state, action) => {
    switch (action.type) {
      case "LOGIN": {
        return {
          currentUser: action.payload.user,
          role:action.payload.role,
        };
      }
      case "LOGOUT": {
        return {
          currentUser: null,
          role:null,
        };
      }
      default:
        return state;
    }
  };
  
  export default AuthReducer;