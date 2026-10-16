import { Albums } from './collections/Albums';
import { Events } from './collections/Events';
import { MapPoints } from './collections/MapPoints';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { Reviews } from './collections/Reviews';
import { Schedule } from './collections/Schedule';
import { Taverns } from './collections/Taverns';
import { Users } from './collections/Users';
import { Zones } from './collections/Zones';
import { Site } from './globals/Site';

/** Коллекции и глобалы CMS одним списком: его берут и конфиг Payload, и тесты полей. */
export const COLLECTIONS = [Events, Schedule, Pages, Zones, Albums, Taverns, Reviews, MapPoints, Media, Users];

export const GLOBALS = [Site];
