import React, { Component, useState, useEffect } from 'react';
import '../../App.css'; /* optional for styling like the :hover pseudo-class */
import USAMap from 'react-usa-map';
import { Redirect } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import { CallToActionButton, MapInstructionsContainer } from './Map.style';
import { STATES } from 'enums';

const ROULETTE_SLOW_INTERVAL =  900;
const ROULETTE_FAST_INTERVAL =  120;

function Map() {
  let [redirectTarget, setRedirectTarget] = useState();
  let [highlightedState, setHighlightedState] = useState(Object.keys(STATES)[30]);
  let [isLocating, setIsLocating] = useState(false);
  let [showRouletteAnimation, setShowRouletteAnimation] = useState(true);
  let [seeMyStateButtonHidden, setSeeMyStateButtonHidden] = useState(true);
  let [geolocatedStateCode, setGeolocatedStateCode] = useState(null);

  const reverseGeocoder = new window.BDCReverseGeocode();

  const statesCustomConfig = () =>
    Object.keys(STATES).reduce((config, currState) => {
      return {
        ...config,
        [currState]: {
          fill: `${currState === highlightedState ? 'rgba(1,1,1,0.5)' : 'rgba(1,1,1,0.7)'}`,
          clickHandler: event => {
            setRedirectTarget(`/state/${currState}`);
          },
        },
      };
  }, {});

  useEffect(() => {
    checkLocationPermission();
    let rouletteAnimationTimer = null;

    if (showRouletteAnimation) {
      const animationInterval = isLocating ? ROULETTE_FAST_INTERVAL : ROULETTE_SLOW_INTERVAL;
      rouletteAnimationTimer = setInterval(() => {
        const stateKeys = Object.keys(STATES);
        const keyIndex = Math.floor(Math.random() * stateKeys.length);
        setHighlightedState(stateKeys[keyIndex]);
      }, animationInterval);
    } else {
      clearTimeout(rouletteAnimationTimer);
    }

    return () => {
      clearTimeout(rouletteAnimationTimer);
    }
  }, [])

  if (redirectTarget) {
    return <Redirect push to={redirectTarget} />;
  }

  /* mandatory */
  let mapHandler = event => {
    alert('No model yet');
  };

  function checkLocationPermission() {
    let hideSeeMyStateButton = false;
    navigator.permissions.query({name:'geolocation'}).then(function(result) {
      switch (result.state) {
        case 'granted':
          fetchStateCode();
          setSeeMyStateButtonHidden(false);
          break;
        case 'denied':
          setSeeMyStateButtonHidden(true);
          break;
        default:
          setSeeMyStateButtonHidden(false);
      }
    });
  }

  function seeMyStateButtonHandler() {
    setIsLocating(true)
    setShowRouletteAnimation(true)
    if (geolocatedStateCode) {
      setRedirectTarget(`/state/${geolocatedStateCode}`);
      return;
    }

    fetchStateCode()
      .then((stateCode) => setRedirectTarget(`/state/${stateCode}`));
  }

  function fetchStateCode() {
    return new Promise((resolve, reject) => {
      getClientLocation()
        .then(reverseGeocodeStateFromLocation)
        .then((geocodeResult) => {
          const stateName = geocodeResult.principalSubdivision;
          const stateCode = Object.keys(STATES).find(key => STATES[key] === stateName);
          setGeolocatedStateCode(stateCode);
          resolve(stateCode);
        })
        .catch((error) => {
          setSeeMyStateButtonHidden(true);
        });
    });
  }

  //function getClientLocation(callback) {
  function getClientLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {enableHighAccuracy: false});
    });
  }

  function reverseGeocodeStateFromLocation(position) {
    return new Promise((resolve, reject) => {
      reverseGeocoder.getClientLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }, function(result) {
        if (!result) {
          reject();
          return;
        }
        resolve(result);
      });
    });

  }

  function handleHoverOn() {
    setShowRouletteAnimation(false);
    setHighlightedState(null);
  }

  function handleHoverOff() {
    setShowRouletteAnimation(true);
  }

  return (
    <div className="Map" onMouseEnter={handleHoverOn} onMouseLeave={handleHoverOff}>
      <MapInstructionsContainer>
        {!seeMyStateButtonHidden && <CallToActionButton disabled={isLocating} onClick={seeMyStateButtonHandler}>
          <Typography variant="h6" >{isLocating ? "Locating..." : "See my state"}</Typography>
        </CallToActionButton>}
        <div>{seeMyStateButtonHidden ? "Click the map to see projections for your state." : "or click the map to see projections for any state."}</div>
      </MapInstructionsContainer>
      <USAMap width="100%" height="auto" customize={statesCustomConfig()} />
    </div>
  );
}

export default Map;
