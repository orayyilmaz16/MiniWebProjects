const taskInput:HTMLInputElement | null = document.querySelector('#taskInput');
const taskBtn:HTMLButtonElement | null = document.querySelector("#taskBtn");
const taskList:HTMLUListElement | null = document.querySelector("#taskList");

type taskType = {
  id:string | number
  text:string
}
let tasks:Array<taskType> = []

function addTask():void{
  if(taskInput){
      const taskTxt = taskInput.value.trim();
      if(taskTxt == '')return 
      tasks.push({
        text:taskTxt,
        id:Date.now()
      })
      taskInput.value = "";
      render()

  }
}

function deleteTask(task : taskType):void{
  tasks = tasks.filter((item:taskType) => item.id!==task.id);
  render();
}



function render():void{
  if(taskList){
    taskList.innerHTML = "";
    tasks.forEach((item: taskType,index:number) => {
      const li:HTMLLIElement= document.createElement("li");
      li.className = "flex justify-between items-center p-2 border-b ";
      const span : HTMLSpanElement = document.createElement('span');
      span.className = "cursor-pointer";
      span.textContent = `${item.id.toString().slice(0,4)} - ${item.text}`;
      const button : HTMLButtonElement = document.createElement("button");
      button.className = "bg-red-500 text-white px-2 py-1 rounded-md";
      button.textContent = "Sil";
      button.addEventListener("click", () => deleteTask(item));
      li.appendChild(span);
      li.appendChild(button);
      taskList.appendChild(li);
    })
  }
}

taskBtn?.addEventListener("click",addTask)