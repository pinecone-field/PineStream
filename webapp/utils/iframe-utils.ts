/**
 * Utilities for handling iFrame scenarios and embedded environments
 */

/**
 * Check if the current page is running inside an iFrame
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top, we're likely in an iFrame
    return true;
  }
}

/**
 * Check if the current environment supports video autoplay
 */
export function supportsVideoAutoplay(): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.autoplay = true;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          video.pause();
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
}

/**
 * Get environment information for debugging
 */
export function getEnvironmentInfo() {
  return {
    isInIframe: isInIframe(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    language: navigator.language,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: screen.width,
      height: screen.height,
    },
  };
}

/**
 * Show a helpful message for iFrame users
 */
export function showIframeMessage(): void {
  if (isInIframe()) {
    console.log("Running in iFrame - some features may be limited");
    console.log("Environment info:", getEnvironmentInfo());
  }
}

/**
 * Attempt to break out of iFrame (useful for video playback issues)
 */
export function breakOutOfIframe(): boolean {
  if (isInIframe()) {
    try {
      window.top.location.href = window.location.href;
      return true;
    } catch (e) {
      console.warn("Cannot break out of iFrame due to same-origin policy");
      return false;
    }
  }
  return false;
}
