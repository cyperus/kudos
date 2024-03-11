import { ActionFunction, LoaderFunction, json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Portal } from '~/components/portal';
import { getUser, requireUserId } from '~/utils/auth.server';
import { getUserById } from '~/utils/user.server';
import { KudoStyle,Color, Emoji } from '@prisma/client';
import { Modal } from '~/components/modal';
import UserCircle from '~/components/user-circle';
import { colorMap, emojiMap } from '~/utils/contants';
import SelectBox from '~/components/select-box';
import Kudo from '~/components/kudo';
import { createKudo } from '~/utils/kudo.server';

export const loader: LoaderFunction = async ({ request, params }) => {
  const { userId } = params;
  if (typeof userId !== 'string') {
    return redirect('/home');
  }
  const recipient = await getUserById(userId);
  const user = await getUser(request);
  return json({ recipient, user });
};
export const action: ActionFunction = async ({request}) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const message = form.get('message');
  const backgroundColor = form.get('backgroundColor');
  const textColor = form.get('textColor')
  const emoji = form.get('emoji')
  const recipientId = form.get('recipientId')
  if (typeof message !=='string' || typeof recipientId!=='string'||typeof backgroundColor!=='string' || typeof textColor!=='string'||typeof emoji!=='string') {
    return json({error:'Invalid Form Data'}, {status: 400})
  }
  if (!message.length) {
    return json({  error: 'Please provide a message', },{status:400})
  }
  if (!recipientId.length) {
    return json({  error: 'No recipient found...', },{status:400})
  }
  await createKudo(message, userId, recipientId, {
    backgroundColor: backgroundColor as Color,
    textColor: textColor as Color,
    emoji: emoji as Emoji,
  })
  return redirect('/home')
}
export default function KudoModel() {
  const actionData = useActionData();
  const [formError] = useState(actionData?.error || '');
  const [formData, setFormData] = useState({
    message: '',
    style: {
      backgroundColor: 'RED',
      textColor: 'WHITE',
      emoji: 'THUMBSUP',
      
    } as KudoStyle;
  })
  const handleChange = (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>,field:string) => {
    setFormData(data => ({
      ...data,
      [field]:e.target.value
    }))
  }
  const handleStyleChange = (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>,field:string) => {
    setFormData((data) => ({
      ...data,
      style: {
        ...data.style,
        [field]: e.target.value
      }
    }))
  }
  const getOptions = (data: any) => Object.keys(data).reduce((acc: any[], curr) => {
    acc.push({
      name: curr.charAt(0).toUpperCase() + curr.slice(1).toUpperCase(),
      value:curr
    })
    return acc;
  }, [])
  const colors = getOptions(colorMap);
  const emojis = getOptions(emojiMap);
  const {recipient,user} = useLoaderData();
  return <Modal isOpen={true} className='w-2/3 p-10'>
    <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full mb-2">{formError}</div>
    <form action="post">
      <input type="hidden" value={recipient.id} name='recipientId' />
      <div className="flex flex-col md:flex-row gap-y-2 md:gap-y-0">
        <div className="flex text-center flex-col items-center gap-y-2 pr-8">
          <UserCircle profile={recipient.profile} className='h-24 w-24' />
          <p className="text-blue-300">
           {recipient.profile.firstName}{recipient.profile.lastName}
          </p>
          {recipient.profile.department && <span className="px-2 py-1 bg-gray-300 rounded-xl text-blue-300 w-auto"> {recipient.profile.department[0].toUpperCase() + recipient.profile.department.slice(1)}</span>}
        </div>
        <div className="flex-1 flex flex-col gap-y-4">
          <textarea name="message" className='w-full rounded-xl h-40 p-4' value={formData.message} onChange={(e) => handleChange(e, 'message')} placeholder={`Say something nice about ${recipient.profile.firstName}...`}></textarea>
          <div className="flex flex-col items-center md:flex-row md:justify-start gap-x-4">
            {/* select boxes go here */}
            <SelectBox options={colors} name="backgroundColor" value={formData.style.backgroundColor} onChange={(e) => handleStyleChange(e, 'backgroundColor')} label='Background Color' containerClassName='w-36' className='w-full rounded-xl px-3 text-gray-400' />
            <SelectBox options={colors} name='textColor' value={formData.style.textColor} onChange={(e) => handleStyleChange(e, 'textColor')} label='Text Color' containerClassName='w-36' className='w-full rounded-xl px-3 text-gray-400' />
          </div>
          <SelectBox options={ emojis} name='emoji' value={formData.style.emoji} onChange={(e) => handleStyleChange(e, 'emoji')} label='Emoji' containerClassName='w-36' className='w-full rounded-xl px-3 text-gray-400' />
        </div>
      </div>
      <br />
      <p className="text-blue-600 font-semibold mb-2">Preview</p>
      <div className="flex flex-col items-center md:flex-row gap-x-24 gap-y-2 md:gap-y-0">
        {/* the preview goes here */}
        <Kudo profile={user.profile} kudo={formData}/>
        <div className="flex-1"></div>
        <button className="rounded-xl bg-yellow-300 font-semibold text-blue-600 h-12 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1" type='submit'>
          Send
        </button>
      </div>
    </form>
  </Modal>;
}