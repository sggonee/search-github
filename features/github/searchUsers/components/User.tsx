'use client';

import { GithubUser } from '../../user/interface';
import Avatar from './Avatar';

interface Props {
  item: GithubUser;
}

export default function User({ item }: Props) {
  return (
    <li className="border rounded px-3 py-2 flex gap-3 items-center">
      {/* 1. 사용자 아바타 이미지 처리: HTML5 Canvas + (옵셔널) WebAssembly 랜더링 훅 */}
      <Avatar url={item.avatar_url} />

      {/* 2. 사용자 기본 정보 (로그인 아이디) */}
      <div className="flex flex-col">
        <span className="font-medium text-sm">{item.login}</span>
        {/* WebAssembly 필터 적용 여부, 언어/위치 등 추가 메타 정보를 여기에 이어서 붙일 수 있습니다. */}
      </div>
    </li>
  );
}
