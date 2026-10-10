import { ModuleProvider, Modules } from '@medusajs/framework/utils';
import PaystackPaymentProviderService from './service.js';

export default ModuleProvider(Modules.PAYMENT, { services: [PaystackPaymentProviderService] });
