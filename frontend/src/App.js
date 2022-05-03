import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as sessionActions from "./store/session";
import Navigation from "./components/Navigation";
import Widgets from './components/Widgets'

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    // const currentLocale = location.pathname
    console.log('how many times?')
    dispatch(sessionActions.restoreUser())
    .then(data => {
      setIsLoaded(true)
      if (!data.user) return navigate('/welcome-to-quickcast/login')
      console.log("then")
    }, res => console.log("REJECTED", res))
      .finally(
        // setIsLoaded(true)
        console.log("finally")
        )
      }, []);
      const session = useSelector(state => state.session)

  // if (!session.user) return <Navigate to='/welcome-to-quickcast'/>
  if (session.user && location.pathname === '/') return <Navigate to='/home'/>
  // console.log('isLoaded ', isLoaded)
  if (isLoaded) return(
    <>
      <Navigation sessionUser={session.user}/>
      <Outlet/>
    </>
  );
  return(
    <h1 style={{color: 'white'}}>LOading</h1>
  )
  }
export default App;
