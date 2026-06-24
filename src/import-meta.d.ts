interface ImportMeta {
	webpackContext: (
		directory: string,
		options: {recursive?: boolean; regExp: RegExp},
	) => {
		keys: () => string[];
		(id: string): unknown;
	};
}
