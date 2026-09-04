import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

import { BASE_URL } from './constants.js';

type Account = {
  username: string;
  active: boolean;
  product?: { name: string; targets: string[] };
};

const test = async (z: ZObject, _bundle: Bundle): Promise<Account> => {
  const response = await z.request({
    url: `${BASE_URL}/v1/user/info`,
    method: 'GET',
  });

  const account: Account | undefined = response.data?.data;

  if (!account?.username) {
    throw new z.errors.Error(
      'Connected to Decodo, but the account details came back empty. Please contact Decodo support if this keeps happening.',
      'AuthTestFailed',
      response.status,
    );
  }

  if (account.active === false) {
    throw new z.errors.Error(
      `The Decodo account "${account.username}" is inactive. Reactivate it in your Decodo dashboard, then reconnect.`,
      'InactiveAccount',
      response.status,
    );
  }

  return account;
};

export default {
  type: 'custom',
  fields: [
    {
      key: 'token',
      label: 'API Token',
      type: 'password',
      required: true,
      helpText:
        'Find this in your [Decodo dashboard](https://dashboard.decodo.com) under your Web Scraping API subscription.',
    },
  ],
  test,
  connectionLabel: '{{username}}',
} satisfies Authentication;
