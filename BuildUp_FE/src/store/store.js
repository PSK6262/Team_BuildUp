import {configureStore} from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import teamReducer from './teamSlice.js';
import themeReducer from './themeSlice.js';

export default configureStore({
    reducer: {
        auth: authReducer,
        team: teamReducer,
        theme: themeReducer,
    }
})
