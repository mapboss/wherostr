import Filter from './Filter'

const MainPane = () => {
  return (
    <div className="absolute left-0 top-0 w-80 flex flex-col">
      <Filter
        className="absolute top-2 left-2"
        onSearch={(evt) => console.log('onSearch', evt)}
      />
      <div className="bg-gray-800 h-80">Contents</div>
    </div>
  )
}

export default MainPane
