import axios from "axios";
import prettyBytes from "pretty-bytes";
import setupEditors from "./setupEditor";

const sendBtn = document.querySelector("[data-submit-btn]");
const queryParamsContainer = document.querySelector("[data-query-params]");
const requestHeadersContainer = document.querySelector(
    "[data-request-headers]"
);
const keyValueTemplate = document.querySelector("[data-key-value-template]");
const responseHeadersContainer = document.querySelector(
    "[data-response-headers]"
);

document
    .querySelector("[data-add-query-param-btn]")
    .addEventListener("click", () => {
        queryParamsContainer.append(createKeyValuePair());
    });

document
    .querySelector("[data-add-request-header-btn]")
    .addEventListener("click", () => {
        requestHeadersContainer.append(createKeyValuePair());
    });

queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());

axios.interceptors.request.use((request) => {
    request.customData = request.customData || {};
    request.customData.startTime = new Date().getTime();
    return request;
});

function updateEndTime(response) {
    response.customData = response.customData || {};
    response.customData.time =
        new Date().getTime() - response.config.customData.startTime;
    return response;
}

axios.interceptors.response.use(updateEndTime, (e) => {
    return Promise.reject(updateEndTime(e.response));
});

const { requestEditor, updateResponseEditor } = setupEditors();

sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log(e);

    let data;
    const url = document.querySelector("[data-url]").value;

    if (!url) {
        alert("Please enter a URL");
        return;
    }

    // Regex for localhost urls
    const isLocalhost = /^(http|https):\/\/localhost(:\d+)?/;
    const urlRegex =
        /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    if (!urlRegex.test(url) && !isLocalhost.test(url)) {
        alert("Please enter a valid URL");
        return;
    }

    try {
        data = JSON.parse(requestEditor.state.doc.toString() || null);
    } catch (e) {
        alert("JSON data is malformed");
        return;
    }

    axios({
        url,
        method: document.querySelector("[data-method]").value,
        params: keyValuePairsToObjects(queryParamsContainer),
        headers: keyValuePairsToObjects(requestHeadersContainer),
        data,
    })
        .catch((e) => e)
        .then((response) => {
            document
                .querySelector("[data-response-section]")
                .classList.remove("d-none");
            updateResponseDetails(response);
            updateResponseEditor(response.data);
            updateResponseHeaders(response.headers);
            console.log(response);
        })
        .catch((e) =>
            alert(
                "Error is occurring while sending request, please check console"
            )
        );
});

function updateResponseDetails(response) {
    document.querySelector("[data-status]").textContent = response.status;
    document.querySelector("[data-time]").textContent =
        response.customData.time;
    document.querySelector("[data-size]").textContent = prettyBytes(
        JSON.stringify(response.data).length +
            JSON.stringify(response.headers).length
    );
}

function updateResponseHeaders(headers) {
    responseHeadersContainer.innerHTML = "";
    Object.entries(headers).forEach(([key, value]) => {
        const keyElement = document.createElement("div");
        keyElement.textContent = key;
        responseHeadersContainer.append(keyElement);
        const valueElement = document.createElement("div");
        valueElement.textContent = value;
        responseHeadersContainer.append(valueElement);
    });
}

function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true);
    element
        .querySelector("[data-remove-btn]")
        .addEventListener("click", (e) => {
            e.target.closest("[data-key-value-pair]").remove();
        });
    return element;
}

function keyValuePairsToObjects(container) {
    const pairs = container.querySelectorAll("[data-key-value-pair]");
    return [...pairs].reduce((data, pair) => {
        const key = pair.querySelector("[data-key]").value;
        const value = pair.querySelector("[data-value]").value;

        if (key === "") return data;
        return { ...data, [key]: value };
    }, {});
}
