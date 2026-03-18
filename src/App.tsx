import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getErrorMessage } from "@/lib/errors";
import { InvitePlaceholderPage } from "@/pages/invite-placeholder-page";
import { LoadingPage } from "@/pages/loading-page";
import { MissingConvexPage } from "@/pages/missing-convex-page";
import { SignInPage } from "@/pages/sign-in-page";
import { WorkspaceScreen } from "@/pages/workspace-screen";

interface AppProps {
  missingConvexUrl?: boolean;
}

const CHANNELS_PATH = "/channels";

export default function App({ missingConvexUrl = false }: AppProps) {
  if (missingConvexUrl) {
    return <MissingConvexPage />;
  }

  return (
    <>
      <AuthLoading>
        <LoadingPage />
      </AuthLoading>
      <Unauthenticated>
        <SignInPage onError={getErrorMessage} />
      </Unauthenticated>
      <Authenticated>
        <Routes>
          <Route element={<WorkspaceScreen />} path={CHANNELS_PATH} />
          <Route
            element={<WorkspaceScreen />}
            path={`${CHANNELS_PATH}/dm/:conversationId`}
          />
          <Route
            element={<WorkspaceScreen />}
            path={`${CHANNELS_PATH}/:serverId`}
          />
          <Route
            element={<WorkspaceScreen />}
            path={`${CHANNELS_PATH}/:serverId/:channelId`}
          />
          <Route element={<InvitePlaceholderPage />} path="/invite/:code" />
          <Route element={<Navigate replace to={CHANNELS_PATH} />} path="*" />
        </Routes>
      </Authenticated>
    </>
  );
}
