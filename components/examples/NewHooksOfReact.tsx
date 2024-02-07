import {
  Dispatch,
  SetStateAction,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CopyBlock, tomorrow } from "react-code-blocks";

import CodeBlock from "../CodeBlock";

const Parent1 = () => {
  return <Child1 />;
};

const Child1 = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
};

export const Example1 = () => {
  return (
    <CodeBlock language="jsx" text={Example1.Source}>
      <Parent1 />
    </CodeBlock>
  );
};

Example1.Source = `const Parent = () => {
  // 如果我想在 Parent 中控制 Child 内部的 count 状态
  // 需要如何实现呢？
  return <Child />;
};

const Child = () => {
  // count 是一个局部状态
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>
        plus
      </button>
      <button onClick={() => setCount((c) => c - 1)}>
        minus
      </button>
    </div>
  );
};
`;

const Parent2 = () => {
  const [toggled, setToggled] = useState(false);

  return (
    <div>
      <div>
        <button onClick={() => setToggled((b) => !b)}>reset</button>
      </div>
      <Child2 toggled={toggled} />
    </div>
  );
};

const Child2 = ({ toggled }: { toggled: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
  }, [toggled]);

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
};

export const Example2 = () => {
  return (
    <CodeBlock language="jsx" text={Example2.Source}>
      <Parent2 />
    </CodeBlock>
  );
};

Example2.Source = `const Parent = () => {
  // 触发 watch handler 的依赖状态
  const [toggled, setToggled] = useState(false);

  return (
    <div>
      <div>
        <button onClick={() => setToggled((b) => !b)}>
          reset
        </button>
      </div>
      <Child2 toggled={toggled} />
    </div>
  );
};

const Child = ({ toggled }: { toggled: boolean }) => {
  const [count, setCount] = useState(0);

  // 利用 useEffect 实现 watch 逻辑
  useEffect(() => {
    setCount(0);
  }, [toggled]);

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
};`;

const Parent3 = () => {
  const setCountRef = useRef<Dispatch<SetStateAction<number>>>(() => {});

  return (
    <div>
      <div>
        <button onClick={() => setCountRef.current(0)}>reset</button>
      </div>
      <Child3 ref={setCountRef} />
    </div>
  );
};

const Child3 = forwardRef<Dispatch<SetStateAction<number>>>((props, ref) => {
  const [count, setCount] = useState(0);

  if (typeof ref === "function") {
    ref(setCount);
  } else if (ref) {
    ref.current = setCount;
  }

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
});

export const Example3 = () => {
  return (
    <CodeBlock language="jsx" text={Example3.Source}>
      <Parent3 />
    </CodeBlock>
  );
};

Example3.Source = `const Parent = () => {
  // 声明一个 ref，它的类型与 Child 中的 setCount 兼容
  const setCountRef = useRef<Dispatch<SetStateAction<number>>>(() => {});

  return (
    <div>
      <div>
        <button onClick={() => setCountRef.current(0)}>reset</button>
      </div>
      <Child ref={setCountRef} />
    </div>
  );
};

const Child = forwardRef<Dispatch<SetStateAction<number>>>((props, ref) => {
  const [count, setCount] = useState(0);

  // 在渲染过程中，同步 ref 引用
  // 更好的方式是使用 useEffect，这里为了省事儿
  // 就直接写在 render 逻辑中了
  // 请勿在生产中参考这种写法
  if (typeof ref === "function") {
    ref(setCount);
  } else if (ref) {
    ref.current = setCount;
  }

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
});`;

interface Child4FakeThis {
  reset: () => void;
}

const Parent4 = () => {
  const setCountRef = useRef<Child4FakeThis>({
    reset: () => {},
  });

  return (
    <div>
      <div>
        <button onClick={() => setCountRef.current.reset()}>reset</button>
      </div>
      <Child4 ref={setCountRef} />
    </div>
  );
};

const Child4 = forwardRef<Child4FakeThis>((props, ref) => {
  const [count, setCount] = useState(0);

  const fakeThis = useMemo<Child4FakeThis>(() => {
    return {
      reset: () => setCount(0),
    };
  }, []);

  if (typeof ref === "function") {
    ref(fakeThis);
  } else if (ref) {
    ref.current = fakeThis;
  }

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
});

export const Example4 = () => {
  return (
    <CodeBlock language="jsx" text={Example4.Source}>
      <Parent4 />
    </CodeBlock>
  );
};

Example4.Source = `interface ChildFakeThis {
  reset: () => void;
}

const Parent = () => {
  const setCountRef = useRef<ChildFakeThis>({
    reset: () => {},
  });

  return (
    <div>
      <div>
        <button onClick={() => setCountRef.current.reset()}>reset</button>
      </div>
      <Child ref={setCountRef} />
    </div>
  );
};

const Child = forwardRef<ChildFakeThis>((props, ref) => {
  const [count, setCount] = useState(0);

  // 使用 useMemo 创建 ChildFakeThis 实例
  const fakeThis = useMemo<ChildFakeThis>(() => {
    return {
      reset: () => setCount(0),
    };
  }, []);

  if (typeof ref === "function") {
    ref(fakeThis);
  } else if (ref) {
    ref.current = fakeThis;
  }

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
});`;

interface Child5FakeThis {
  reset: () => void;
}

const Parent5 = () => {
  const setCountRef = useRef<Child5FakeThis>({
    reset: () => {},
  });

  return (
    <div>
      <div>
        <button onClick={() => setCountRef.current.reset()}>reset</button>
      </div>
      <Child5 ref={setCountRef} />
    </div>
  );
};

const Child5 = forwardRef<Child5FakeThis>((props, ref) => {
  const [count, setCount] = useState(0);

  useImperativeHandle(
    ref,
    () => {
      return {
        reset: () => setCount(0),
      };
    },
    []
  );

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
});

export const Example5 = () => {
  return (
    <CodeBlock language="jsx" text={Example5.Source}>
      <Parent5 />
    </CodeBlock>
  );
};

Example5.Source = `const Child = forwardRef<ChildFakeThis>((props, ref) => {
  const [count, setCount] = useState(0);

  // 使用 useImperativeHandle 进行改写
  useImperativeHandle(ref, () => {
      return {
        reset: () => setCount(0),
      };
    },
    []
  );

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>plus</button>
      <button onClick={() => setCount((c) => c - 1)}>minus</button>
    </div>
  );
});`;
