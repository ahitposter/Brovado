import React, { useState, useEffect } from "react";

const ErrorBoundary = ({ children, handleError }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (hasError) {
            // Log the error to your logging service
            console.error("An error occurred in the component tree.");

            // Display "Something went wrong" in the App's error-bar
            handleError("Something went wrong");
        }
    }, [hasError, handleError]);

    const componentDidCatch = (error, info) => {
        setHasError(true);
    };

    if (React.Children.count(children) === 0) {
        return null;
    }

    return React.cloneElement(React.Children.only(children), {
        componentDidCatch,
    });
};

export default ErrorBoundary;
