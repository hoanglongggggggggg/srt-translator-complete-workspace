/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import "./styles/index.css";

import AppShell from "./layouts/AppShell";

// Pages
import WelcomePage from "./pages/Welcome";
import DashboardPage from "./pages/Dashboard";
import ApiKeysPage from "./pages/ApiKeys";
import AuthFilesPage from "./pages/AuthFiles";
import LogViewerPage from "./pages/LogViewer";
import AnalyticsPage from "./pages/Analytics";
import SettingsPage from "./pages/Settings";

import TranslatePage from "./pages/Translate";
import TranslateSettingsPage from "./pages/TranslateSettings";
import PreviewPage from "./pages/Preview";

const root = document.getElementById("root");

render(
  () => (
    <Router>
      <Route path="/" component={AppShell}>
        <Route path="/" component={TranslatePage} />
        <Route path="/translate" component={TranslatePage} />

        <Route path="/welcome" component={WelcomePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/api-keys" component={ApiKeysPage} />
        <Route path="/auth-files" component={AuthFilesPage} />
        <Route path="/logs" component={LogViewerPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/settings" component={SettingsPage} />

        <Route path="/translate-settings" component={TranslateSettingsPage} />
        <Route path="/preview" component={PreviewPage} />
      </Route>
    </Router>
  ),
  root!,
);
