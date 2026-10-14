import emptyMarketplace from './illustrations/empty-marketplace.svg?url';
import emptyOrders from './illustrations/empty-orders.svg?url';
import emptyRequests from './illustrations/empty-requests.svg?url';
import loginIllustration from './illustrations/login.svg?url';
import noResults from './illustrations/no-results.svg?url';
import success from './illustrations/success.svg?url';
import construction from './materials/construction.svg?url';
import electronics from './materials/electronics.svg?url';
import glass from './materials/glass.svg?url';
import metal from './materials/metal.svg?url';
import other from './materials/other.svg?url';
import organic from './materials/organic.svg?url';
import paper from './materials/paper.svg?url';
import plastic from './materials/plastic.svg?url';
import rubber from './materials/rubber.svg?url';
import textile from './materials/textile.svg?url';
import wood from './materials/wood.svg?url';
import favicon from './favicon.svg?url';
import logoDark from './logo-dark.svg?url';
import logo from './logo.svg?url';

export type MaterialIconKey =
  | 'metal'
  | 'plastic'
  | 'paper'
  | 'glass'
  | 'electronics'
  | 'textile'
  | 'rubber'
  | 'wood'
  | 'organic'
  | 'construction'
  | 'other';

const materials: Record<MaterialIconKey, string> = {
  metal,
  plastic,
  paper,
  glass,
  electronics,
  textile,
  rubber,
  wood,
  organic,
  construction,
  other,
};

export const ASSETS = {
  logo,
  logoDark,
  favicon,
  illustrations: {
    login: loginIllustration,
    emptyRequests,
    emptyMarketplace,
    emptyOrders,
    success,
    noResults,
  },
  materials,
  materialIcon(category: string): string {
    return category in materials ? materials[category as MaterialIconKey] : materials.other;
  },
} as const;
