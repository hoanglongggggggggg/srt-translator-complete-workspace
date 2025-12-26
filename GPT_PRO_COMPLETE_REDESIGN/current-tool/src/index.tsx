/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import "./styles/index.css";

import HomePage from "./pages/Home";
import SettingsPage from "./pages/Settings";
import PreviewPage from "./pages/Preview";

const root = document.getElementById("root");

render(
    () => (
        <Router>
            <Route path="/" component={HomePage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/preview" component={PreviewPage} />
        </Router>
    ),
    root!
);
