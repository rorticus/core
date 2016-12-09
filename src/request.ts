import Task from './async/Task';
import { Handle } from 'dojo-interfaces/core';
import MatchRegistry, { Test } from './MatchRegistry';
import { ParamList } from './UrlSearchParams';
import xhr from './request/xhr';

declare var require: any;

export class FilterRegistry extends MatchRegistry<RequestFilter> {
	register(test: string | RegExp | RequestFilterTest | null, value: RequestFilter, first?: boolean): Handle {
		let entryTest: Test;
		const inTest = test;

		if (typeof inTest === 'string') {
			entryTest = (response, url, options) => {
				return inTest === url;
			};
		}
		else if (inTest instanceof RegExp) {
			entryTest = (response, url, options) => {
				return inTest.test(url);
			};
		}
		else {
			entryTest = <RequestFilterTest> inTest;
		}

		return super.register(entryTest, value, first);
	}
}

export class ProviderRegistry extends MatchRegistry<RequestProvider> {
	register(test: string | RegExp | RequestProviderTest | null, value: RequestProvider, first?: boolean): Handle {
		let entryTest: Test;

		if (typeof test === 'string') {
			entryTest = (url, options) => {
				return test === url;
			};
		}
		else if (test instanceof RegExp) {
			entryTest = (url, options) => {
				return test ? (<RegExp> test).test(url) : null;
			};
		}
		else {
			entryTest = <RequestProviderTest> test;
		}

		return super.register(entryTest, value, first);
	}

	setDefaultProvider(defaultProvider: RequestProvider) {
		this._defaultValue = defaultProvider;
	}
}

/**
 * Request filters, which filter or modify responses. The default filter simply passes a response through unchanged.
 */
export const filterRegistry = new FilterRegistry(function (response: Response<any>): Response<any> {
	return response;
});

/**
 * Request providers, which fulfill requests.
 */
export const providerRegistry = new ProviderRegistry(xhr);

export interface RequestError<T> extends Error {
	response: Response<T>;
}

export interface RequestFilter {
	<T>(response: Response<T>, url: string, options?: RequestOptions): T;
}

export interface RequestFilterTest extends Test {
	<T>(response: Response<any>, url: string, options?: RequestOptions): boolean | null;
}

export interface RequestOptions {
	auth?: string;
	cacheBust?: any;
	data?: any;
	headers?: { [name: string]: string; };
	method?: string;
	password?: string;
	query?: string | ParamList;
	responseType?: string;
	timeout?: number;
	user?: string;
}

export interface RequestProvider {
	<T>(url: string, options?: RequestOptions): ResponsePromise<T>;
}

export interface RequestProviderTest extends Test {
	(url: string, options?: RequestOptions): boolean | null;
}

export interface Response<T> {
	data: T | null;
	nativeResponse?: any;
	requestOptions: RequestOptions;
	statusCode: number | null | undefined;
	statusText?: string | null;
	url: string;

	getHeader(name: string): null | string;
}

/**
 * The task returned by a request, which will resolve to a Response
 */
export interface ResponsePromise<T> extends Task<Response<T>> {}

/**
 * Make a request, returning a Promise that will resolve or reject when the request completes.
 */
const request: {
	<T>(url: string, options?: RequestOptions): ResponsePromise<T>;
	delete<T>(url: string, options?: RequestOptions): ResponsePromise<T>;
	get<T>(url: string, options?: RequestOptions): ResponsePromise<T>;
	post<T>(url: string, options?: RequestOptions): ResponsePromise<T>;
	put<T>(url: string, options?: RequestOptions): ResponsePromise<T>;
	setDefaultProvider(provider: RequestProvider): void;
} = <any> function request<T>(url: string, options: RequestOptions = {}): ResponsePromise<T> {
	return providerRegistry.match(url, options)(url, options)
		.then(function (response: Response<T>) {
			return Task.resolve(filterRegistry.match(response, url, options)(response, url, options))
				.then(function (filterResponse: any) {
					response.data = filterResponse.data;
					return response;
				});
		});
};

request.setDefaultProvider = provider => providerRegistry.setDefaultProvider(provider);

[ 'DELETE', 'GET', 'POST', 'PUT' ].forEach(function (method) {
	(<any> request)[method.toLowerCase()] = function <T>(url: string, options: RequestOptions = {}): ResponsePromise<T> {
		options = Object.create(options);
		options.method = method;
		return request(url, options);
	};
});

export default request;

/**
 * Add a filter that automatically parses incoming JSON responses.
 */
filterRegistry.register(
	function (response: Response<any>, url: string, options: RequestOptions): boolean {
		return Boolean(typeof response.data && options && options.responseType === 'json');
	},
	function (response: Response<any>, url: string, options: RequestOptions): Object {
		return {
			data: JSON.parse(String(response.data))
		};
	}
);
