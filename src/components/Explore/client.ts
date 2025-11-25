import ky, { Options } from 'ky';
import {
  GetChartRequest,
  GetChartResponse,
  GetGemsTokenListIndividualResponse,
  GetGemsTokenListRequest,
  GetTokenDescriptionResponse,
  GetTokenRequest,
  GetTokenResponse,
  GetTopHoldersResponse,
  GetTxsRequest,
  GetTxsResponse,
} from './types';
import { serializeParams } from '@/lib/utils';


const BASE_URL = 'https://datapi.jup.ag';

const client = ky.create({
  prefixUrl: BASE_URL,
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response;
        }
        // If response is not JSON (e.g. HTML error page), throw a better error
        const text = await response.text();
        throw new Error(`Expected JSON response but got ${contentType}: ${text.substring(0, 100)}...`);
      },
    ],
  },
});

export class ApeClient {
  static async getGemsTokenList<T extends GetGemsTokenListRequest>(
    req: T,
    options?: Options
  ): Promise<{
    [K in keyof T]: undefined extends T[K]
      ? GetGemsTokenListIndividualResponse | undefined
      : GetGemsTokenListIndividualResponse;
  }> {
    return client
      .post('v1/pools/gems', {
        json: req,
        ...options,
      })
      .json();
  }
  static async getToken(req: GetTokenRequest, options?: Options): Promise<GetTokenResponse> {
    return client
      .get('v1/pools', {
        searchParams: serializeParams({
          assetIds: [req.id],
        }),
        ...options,
      })
      .json();
  }

  static async getTokenHolders(assetId: string, options?: Options): Promise<GetTopHoldersResponse> {
    return client.get(`v1/holders/${assetId}`, options).json();
  }

  static async getChart(
    assetId: string,
    params: GetChartRequest,
    options?: Options
  ): Promise<GetChartResponse> {
    return client
      .get(`v2/charts/${assetId}`, {
        searchParams: serializeParams(params),
        ...options,
      })
      .json();
  }

  static async getTokenTxs(
    assetId: string,
    req: GetTxsRequest,
    options?: Options
  ): Promise<GetTxsResponse> {
    return client
      .get(`v1/txs/${assetId}`, {
        searchParams: serializeParams(req),
        ...options,
      })
      .json();
  }

  static async getTokenDescription(
    assetId: string,
    options?: Options
  ): Promise<GetTokenDescriptionResponse> {
    return client.get(`v1/assets/${assetId}/description`, options).json();
  }
}
