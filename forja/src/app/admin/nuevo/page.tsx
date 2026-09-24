import { esAdminPlataforma } from '@/lib/admin';
import { baseUrl } from '@/lib/url';
import { MarcoAdmin, SinAccesoAdmin } from '../MarcoAdmin';
import { FormularioGym } from './FormularioGym';

export default async function NuevoGym() {
  if (!(await esAdminPlataforma('/admin/nuevo'))) return <SinAccesoAdmin />;

  return (
    <MarcoAdmin titulo="Dar de alta un gimnasio" bajada="Crea el gimnasio, sus máquinas y la cuenta de su dueño, de una vez">
      <FormularioGym baseUrl={await baseUrl()} />
    </MarcoAdmin>
  );
}
