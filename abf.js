(function() {
    'use strict';

    const randomize = (base, deviation) => base + (Math.random() * deviation - deviation / 2);

    // Canvas fingerprinting
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
        const context = this.getContext('2d');
        const imageData = context.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = randomize(imageData.data[i], 10);     // R
            imageData.data[i + 1] = randomize(imageData.data[i + 1], 10); // G
            imageData.data[i + 2] = randomize(imageData.data[i + 2], 10); // B
        }
        context.putImageData(imageData, 0, 0);
        return originalToDataURL.apply(this, arguments);
    };

    // WebGL fingerprinting
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        const result = originalGetParameter.call(this, parameter);
        if (typeof result === 'number') {
            return randomize(result, 0.1);
        }
        return result;
    };

    // Audio fingerprinting
    const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
        originalGetFloatFrequencyData.call(this, array);
        for (let i = 0; i < array.length; i++) {
            array[i] = randomize(array[i], 0.1);
        }
    };

    // Font fingerprinting
    const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function(text) {
        const metrics = originalMeasureText.apply(this, arguments);
        metrics.width = randomize(metrics.width, 0.1);
        return metrics;
    };

    // Navigator language and geolocation
    Object.defineProperty(navigator, 'language', { value: 'en-US' });
    Object.defineProperty(navigator, 'languages', { value: ['en-US'] });
    Object.defineProperty(navigator, 'userLanguage', { value: 'en-US' });
    Object.defineProperty(navigator, 'browserLanguage', { value: 'en-US' });
    Object.defineProperty(navigator, 'systemLanguage', { value: 'en-US' });

    // Geolocation API
    const mockGeolocation = {
        getCurrentPosition: function(success, error, options) {
            success({
                coords: {
                    latitude: 51.509865,  // Example coordinates
                    longitude: -0.118092,
                    accuracy: 10,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                },
                timestamp: Date.now()
            });
        },
        watchPosition: function(success, error, options) {
            return setInterval(() => {
                success({
                    coords: {
                        latitude: 51.509865,
                        longitude: -0.118092,
                        accuracy: 10,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    },
                    timestamp: Date.now()
                });
            }, 10000);
        },
        clearWatch: function(id) {
            clearInterval(id);
        }
    };

    navigator.geolocation = mockGeolocation;

})();

