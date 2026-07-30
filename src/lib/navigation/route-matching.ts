export const normalizeNavigationPath = (value: string) => {
    const withoutQueryOrHash = value.split(/[?#]/, 1)[0] || '/';
    const withLeadingSlash = withoutQueryOrHash.startsWith('/')
        ? withoutQueryOrHash
        : `/${withoutQueryOrHash}`;

    return withLeadingSlash.replace(/\/+$/, '') || '/';
};

export const isSegmentSafeRouteMatch = (
    pathname: string,
    routeHref: string,
) => {
    const normalizedPathname = normalizeNavigationPath(pathname);
    const normalizedRoute = normalizeNavigationPath(routeHref);

    if (normalizedPathname === normalizedRoute) {
        return true;
    }

    return (
        normalizedRoute !== '/' &&
        normalizedPathname.startsWith(`${normalizedRoute}/`)
    );
};

export const findActiveNavigationHref = (
    pathname: string,
    routeHrefs: string[],
) => {
    const normalizedPathname = normalizeNavigationPath(pathname);
    const normalizedRoutes = Array.from(
        new Set(routeHrefs.map(normalizeNavigationPath)),
    );
    const exactMatch = normalizedRoutes.find(
        (route) => route === normalizedPathname,
    );

    if (exactMatch) {
        return exactMatch;
    }

    return (
        normalizedRoutes
            .filter((route) =>
                isSegmentSafeRouteMatch(normalizedPathname, route),
            )
            .sort((left, right) => right.length - left.length)[0] ?? null
    );
};

export const isNavigationGroupActive = ({
    pathname,
    groupPath,
    childHrefs,
    activeLeafHref,
}: {
    pathname: string;
    groupPath?: string;
    childHrefs: string[];
    activeLeafHref: string | null;
}) => {
    const containsActiveChild = childHrefs.some(
        (href) => normalizeNavigationPath(href) === activeLeafHref,
    );

    return (
        containsActiveChild ||
        (Boolean(groupPath) &&
            normalizeNavigationPath(pathname) ===
                normalizeNavigationPath(groupPath ?? ''))
    );
};
