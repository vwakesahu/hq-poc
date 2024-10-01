const BasicPageLayout = ({ children, title }) => {
  return (
    <>
      <div className="py-8 text-2xl font-semibold max-w-4xl mx-auto">{title}</div>
      {children}
    </>
  );
};

export default BasicPageLayout;
