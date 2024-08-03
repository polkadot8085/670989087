(function() {
    'use strict';

    const spoofLanguage = 'en-US';
    const spoofTimezone = 'America/New_York';

    // Spoof navigator.language and navigator.languages
    Object.defineProperty(navigator, 'language', {
        get: function() {
            return spoofLanguage;
        }
    });
    Object.defineProperty(navigator, 'languages', {
        get: function() {
            return [spoofLanguage];
        }
    });

    // Spoof Intl.DateTimeFormat
    const originalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(locale, options) {
        return new originalDateTimeFormat(spoofLanguage, options);
    };

    // Spoof timezone offset
    Date.prototype.getTimezoneOffset = function() {
        return -new Date().getTimezoneOffset();
    };

    // Spoof geolocation API
    navigator.geolocation.getCurrentPosition = function(success, error, options) {
        const mockPosition = {
            coords: {
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 1,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        };
        success(mockPosition);
    };

    // Spoof WebGL
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
            return 'Intel Inc.';
        }
        if (parameter === 37446) {
            return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter(parameter);
    };

    const getExtension = WebGLRenderingContext.prototype.getExtension;
    WebGLRenderingContext.prototype.getExtension = function(name) {
        if (name === 'WEBGL_debug_renderer_info') {
            return null;
        }
        return getExtension(name);
    };

    const getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
        return getSupportedExtensions().filter(name => name !== 'WEBGL_debug_renderer_info');
    };

    // Spoof fonts
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element, pseudoElt) {
        const style = originalGetComputedStyle(element, pseudoElt);
        const fontFamilies = ['Arial', 'Helvetica', 'sans-serif'];
        style.fontFamily = fontFamilies.join(',');
        return style;
    };

    // Spoof Canvas
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextType) {
        const context = originalGetContext.apply(this, arguments);
        if (contextType === '2d' || contextType === 'webgl' || contextType === 'webgl2') {
            const originalGetImageData = context.getImageData;
            context.getImageData = function(x, y, width, height) {
                const imageData = originalGetImageData.apply(this, arguments);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] = imageData.data[i] ^ 0xFF;  // Invert the color for fingerprinting
                }
                return imageData;
            };
        }
        return context;
    };

    // Spoof AudioContext
    const originalAudioContext = window.AudioContext;
    const originalOfflineAudioContext = window.OfflineAudioContext;
    const spoofSampleRate = 44100;

    window.AudioContext = function() {
        const context = new originalAudioContext();
        Object.defineProperty(context, 'sampleRate', {
            get: function() {
                return spoofSampleRate;
            }
        });
        return context;
    };

    window.OfflineAudioContext = function() {
        const context = new originalOfflineAudioContext(arguments[0], arguments[1], arguments[2]);
        Object.defineProperty(context, 'sampleRate', {
            get: function() {
                return spoofSampleRate;
            }
        });
        return context;
    };

})();
