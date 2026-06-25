import {
  demoRenderApiResponse,
  demoRenderRequest,
} from "./render-demo-fixtures";

export const renderApiEndpoint = "/api/render";

export const renderApiMethod = "POST";

export const renderApiDescription =
  "Mock-safe render API endpoint that validates a render request, creates a render queue, runs the mock render pipeline, and returns a SaaS-ready render response. It does not invoke real Remotion rendering or write files.";

export const renderApiExampleRequest = demoRenderRequest;

export const renderApiExampleResponse = {
  ok: true,
  data: demoRenderApiResponse,
};

export const renderApiDocs = {
  endpoint: renderApiEndpoint,
  method: renderApiMethod,
  description: renderApiDescription,
  exampleRequest: renderApiExampleRequest,
  exampleResponse: renderApiExampleResponse,
};
