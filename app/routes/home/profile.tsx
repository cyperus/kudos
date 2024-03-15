import { ActionFunction, LoaderFunction, json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import FormField from '~/components/form-field';
import { Modal } from '~/components/modal';
import SelectBox from '~/components/select-box';
import { getUser, logout, requireUserId } from '~/utils/auth.server';
import { departments } from '~/utils/contants';
import { deleteUser, updateUser,deleteUser } from '~/utils/user.server';
import { validateName } from '~/utils/validators.server';
import type { Department } from '@prisma/client';
import { ImageUploader } from '~/components/image-uploader';
export const action: ActionFunction = async ({ request }) => {
  const userId=await requireUserId(request);
  const formData = await request.formData();
  // pulls out the form data points you need from the request object
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const department = formData.get('department');
  const action = formData.get('_action');
  switch (action) {
    case 'save':
      // ensure each piece of data you care about is of the string data type
      if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof department !== 'string') {
        return json({ error: `Invalid Form Data` }, { status: 400 });
      }
      // validate the data using the validateName function
      const errors = {
        firstName: validateName(firstName),
        lastName: validateName(lastName),
        department: validateName(department),
      };
      if (Object.values(errors).some(Boolean)) {
        return json({ errors, fields: { firstName, lastName, department } }, { status: 400 });
      }
      await updateUser(userId, { firstName, lastName, department as Department });
      // redirects to the /home route, closing the setting modal
      return redirect('/home');
    case "delete": 
      await deleteUser(userId);
      return logout(request);
      break;

    default:
     return json({ error: `Invalid Form Data` }, { status: 400 });
  }
  
};
export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  return json({ user });
};
export default function ProfileSetting() {
  const { user } = useLoaderData();
  const actionData = useActionData();
  const [formError, setFormError] = useState(actionData?.error || '')
  const firstLoad=useRef(true);
  const [formData, setFormData] = useState({
    firstName:actionData?.fields?.firstName || user?.profile?.firstName,
    lastName:actionData?.fields?.lastName || user?.profile?.lastName,
    department: actionData?.fields?.department || user?.profile?.department || 'MARKETING',
    profilePicture: user?.profile?.profilePicture || '',
  });
  useEffect(() => {
    if (!firstLoad.current) {
      setFormError('')
    }
  }, [formData])
  useEffect(() => {
    firstLoad.current = false
  },[])
  const handleFileUpload =async (file:File) => {
    let inputFormData = new FormData();
    inputFormData.append('profile-pic', file);
    const response = await fetch('/avatar', {
      method: 'POST',
      body: inputFormData
      
    })
    const { imageUrl }=await response.json();
    setFormData((data) => ({
      ...data,
      profilePicture: imageUrl,
    }));
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormData((data) => ({
      ...data,
      [field]: e.target.value,
    }));
  };
  return (
    <Modal isOpen={true} className="w-1/3">
      <div className="p-3">
        <h2 className="text-4xl font-semibold text-blue-600 text-center mb-4">Your Profile</h2>
        <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full mb-2">{ formError}</div>
        <div className="flex">
          <div className="w-1/3">
            <ImageUploader onChange={handleFileUpload} imageUrl={formData.profilePicture}/>
          </div>
          <div className="flex-1">
            <form method="post" onSubmit={e=>!confirm('Are you sure?')?e.preventDefault():true}>
              <FormField htmlFor="firstName" label="First Name" value={formData.firstName} onChange={(e) => handleInputChange(e, 'firstName')} error={actionData?.errors?.firstName} />
              <FormField htmlFor="lastName" label="Last Name" value={formData.lastName} onChange={(e) => handleInputChange(e, 'lastName')} error={actionData?.errors?.lastName} />
              <SelectBox className="w-full rounded-xl px-3 py-2 text-gray-400" id="department" label="Department" name="department" options={departments} value={formData.department} onChange={(e) => handleInputChange(e, 'department')} />
              <button className="rounded-xl w-full bg-red-300 font-semibold text-white mt-4 px-16 py-2 transition duration-300 ease-in-out hover:bg-red-400 hover:-translate-y-1" name='_action' value='delete'>Delete Account</button>
              <div className="text-right mt-4 w-full">
                <button className="rounded-xl bg-yellow-300 font-semibold text-blue-600 px-16 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1" name='_action' value='save'>Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
}
