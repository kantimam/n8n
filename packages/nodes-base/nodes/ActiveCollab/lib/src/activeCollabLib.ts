
import axios, {AxiosResponse} from "axios";




export interface IClient {
    get: (path: string) => Promise<AxiosResponse>;
    post: (path: string, data: JSON | object) => Promise<AxiosResponse>;
    put: (path: string, data?: JSON | object) => Promise<AxiosResponse>;
    delete: (path: string) => Promise<AxiosResponse>;
  }
  

export const API_VERSION = "/api/v1";
export const API = {
    BASE_URL: "https://app.activecollab.com",
    EXTERNAL_LOGIN_URL: "https://activecollab.com/api/v1/external/login",
    USER: {
        USERS: `${API_VERSION}/users`,
    },
    TOKEN: {
        ISSUE_TOKEN_INTENT: `${API_VERSION}/issue-token-intent`,
        ISSUE_TOKEN: `${API_VERSION}/issue-token`,
    },
};



export abstract class Authentication {
    public url: string;
    protected client_name: string;
    protected client_vendor: string;
    protected email: string;

    private password: string;
    private X_ANGIE_AUTH_API: string = "";

    constructor(email: string, password: string, client_name: string, client_vendor: string, url: string = API.BASE_URL) {
        this.email = email;
        this.password = password;
        this.client_name = client_name;
        this.client_vendor = client_vendor;
        this.url = url;
    }

    protected getEmail = (): string => this.email;

    protected getPassword = (): string => this.password;

    protected getToken = (): string => this.X_ANGIE_AUTH_API;

    public getUrl = (): string => this.url;

    public getClientName = (): string => this.client_name;

    public getClientVendor = (): string => this.client_vendor;

    protected setToken(newX_ANGIE_AUTH_API: string): string {
        return this.X_ANGIE_AUTH_API = newX_ANGIE_AUTH_API;
    }
}



class Client extends Authentication implements IClient {
  private account_id?: number;

  constructor(
    email: string,
    password: string,
    client_name: string,
    client_vendor: string,
    account_id?: number,
    url?: string
  ) {
    super(email, password, client_name, client_vendor, url);
    this.account_id = account_id;
  }

  private isSelfHosted(): boolean {
    if (this.getUrl() === API.BASE_URL) {
      return false;
    }
    return true;
  }

  /**
   * @description Builds API endpoint
   * @returns String
   */
  protected endpoint(component?: string): string {
    const { TOKEN, BASE_URL } = API;

    if (this.isSelfHosted()) {
      return component
        ? `${this.getUrl()}${API_VERSION}/${component}`
        : `${this.getUrl()}${TOKEN.ISSUE_TOKEN}`;
    }
    return component
      ? `${BASE_URL}/${this.account_id}${API_VERSION}/${component}`
      : `${BASE_URL}/${this.account_id}${TOKEN.ISSUE_TOKEN_INTENT}`;
  }

  protected async fetchIntent(): Promise<string | undefined> {
    const res = await axios.post(API.EXTERNAL_LOGIN_URL, {
      email: this.getEmail(),
      password: this.getPassword(),
    });
    if (res.data.is_ok === 1) {
      return res.data.user.intent;
    } else {
      throw new Error("Could not fetch intent...");
    }
  }

  /**
   * @description Issues token based on the account_id
   * @returns String X-Angie-AuthApi Token
   */
  public async issueToken(): Promise<void> {
    try {
      let res = null;
      // Self Hosted
      if (this.isSelfHosted()) {
        res = await axios.post(this.endpoint(), {
          username: this.getEmail(),
          password: this.getPassword(),
          client_name: this.getClientName(),
          client_vendor: this.getClientVendor(),
        });
        res.data.is_ok ? this.setToken(res.data.token) : new Error();
      } else {
        const intent = await this.fetchIntent();
        res = await axios.post(this.endpoint(), {
          intent: intent,
          client_name: this.getClientName(),
          client_vendor: this.getClientVendor(),
        });
        res.data.is_ok ? this.setToken(res.data.token) : new Error();
      }
    } catch (e) {
      console.error(e);
    }
  }

  public async get(path: string): Promise<AxiosResponse> {
    return await axios.get(this.endpoint(path), {
      headers: {
        "X-Angie-AuthApiToken": this.getToken(),
      },
    });
  }

  public async post(path: string, data: JSON | object): Promise<AxiosResponse> {
    return await axios.post(this.endpoint(path), data, {
      headers: {
        "X-Angie-AuthApiToken": this.getToken(),
        "Content-Type": "application/json",
      },
    });
  }

  public async put(path: string, data?: JSON | object): Promise<AxiosResponse> {
    return await axios.put(this.endpoint(path), data, {
      headers: {
        "X-Angie-AuthApiToken": this.getToken(),
        "Content-Type": "application/json",
      },
    });
  }

  public async delete(path: string): Promise<AxiosResponse> {
    return await axios.delete(this.endpoint(path), {
      headers: {
        "X-Angie-AuthApiToken": this.getToken(),
      },
    });
  }
}


export default Client;