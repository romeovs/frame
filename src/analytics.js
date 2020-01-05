import * as React from "react"

type FathomConfig = {
	host : string,
	id : string,
}

type MatomoConfig = {
	host : string,
}

export type AnalyticsConfig = {
	fathom? : FathomConfig,
	matomo? : MatomoConfig,
}

// Add analytics scripts
export function analytics (config : AnalyticsConfig) : React.Node {
	return (
		<>
			{fathom(config.fathom)}
			{matomo(config.matomo)}
		</>
	)
}

// Build the fathom script, see https://github.com/usefathom/fathom
function fathom (config : ?FathomConfig) : React.Node {
	if (!config) {
		return null
	}

	return script(`
		(function(f, a, t, h, o, m){
		a[h]=a[h]||function(){(a[h].q=a[h].q||[]).push(arguments)};
		o=f.createElement("script"),
		m=f.getElementsByTagName("script")[0];
		o.async=1; o.src=t; o.id="fathom-script";
		m.parentNode.insertBefore(o,m)
		})(document, window, "//${config.host}/tracker.js", "fathom");
		fathom("set", "siteId", "${config.id}");
		fathom("trackPageview");
	`)
}

function matomo (config : ?MatomoConfig) : React.Node {
	if (!config) {
		return null
	}

	return script(`
		var _paq = _paq || [];
		_paq.push(['trackPageView']);
		_paq.push(['enableLinkTracking']);
		(function() {
			var u="//${config.host}/";
			_paq.push(['setTrackerUrl', u+'piwik.php']);
			_paq.push(['setSiteId', '1']);
			var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
			g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
		})();
	`)
}

function script (str : string) : React.Node {
	return <script dangerouslySetInnerHTML={{ __html: str }} />
}
