import { Events } from './collections/Events';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { Schedule } from './collections/Schedule';
import { Taverns } from './collections/Taverns';
import { Users } from './collections/Users';
import { Zones } from './collections/Zones';
import { Site } from './globals/Site';

/** Коллекции и глобалы CMS одним списком: его берут и конфиг Payload, и тесты полей. */
export const COLLECTIONS = [Events, Schedule, Pages, Zones, Taverns, Media, Users];

export const GLOBALS = [Site];
