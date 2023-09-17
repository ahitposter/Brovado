// ErrorBoundary.js
import React, { Component } from "react";

class ErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("Caught error: ", error, info);
        if (this.props.handleError) {
            this.props.handleError("Something went wrong");
        }
    }

    render() {
        if (this.state.hasError) {
            return null; // You can also return a fallback UI
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
